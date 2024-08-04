import { ElectricityEntity } from "./ElectricityEntity";


export class ElectricityEdge {

    private From: ElectricityEntity;
    private To: ElectricityEntity;
    private sourceHandle: string;
    private targetHandle: string;
    private flowBeginSeconds: number;

    constructor(From: ElectricityEntity, To: ElectricityEntity, sourceHandle: string, targetHandle: string, flowBeginSeconds: number) {
        this.From = From;
        this.To = To;
        this.sourceHandle = sourceHandle;
        this.targetHandle = targetHandle;
        this.flowBeginSeconds = flowBeginSeconds;
    }

    public getEdgeDescription() {
        var nodeType = this.To.getNodeTypeDescription();
        var flowRate: number = ElectricityEntity.getElectricityFlowRate(this.From, this.To);
        var color = nodeType.isSubHome ? ElectricityEntity.getInboundColor(this.To) : ElectricityEntity.getInboundColor(this.From);
        var animSpeed = "0s";
        if (Number.isFinite(flowRate) && !Number.isNaN(flowRate) && flowRate != 0)
            animSpeed = String(Math.round((1 / flowRate) * 10) / 10) + "s";

        return {
            id: this.From.getNodeId() + '-' + this.To.getNodeId(),
            data: {
                animationSpeed: animSpeed,
                dotColor: color,
                lineColor: color,
                begin: this.flowBeginSeconds,
            },
            type: 'flowEdge',
            animated: true,
            source: this.From.getNodeId(),
            target: this.To.getNodeId(),
            sourceHandle: this.sourceHandle,
            targetHandle: this.targetHandle
        };
    }
}